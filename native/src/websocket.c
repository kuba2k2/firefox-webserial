/* Copyright (c) Kuba Szczodrzyński 2023-08-22. */

#include "websocket.h"

#define WS_RESPONSE(opc)                                                                                               \
	do {                                                                                                               \
		ws_message_opcode_t opcode = opc;                                                                              \
		ws_sendframe_bin(conn, (const char *)&opcode, 1);                                                              \
	} while (0)

void websocket_start() {
	struct ws_events evs;
	evs.onopen	  = &websocket_on_open;
	evs.onclose	  = &websocket_on_close;
	evs.onmessage = &websocket_on_message;

	ws_socket(&evs, 23290, true, 1000);
}

void websocket_on_open(ws_cli_conn_t *conn) {
	stdmsg_send_log("WS connection opened");
}

void websocket_on_close(ws_cli_conn_t *conn) {
	stdmsg_send_log("WS connection closed");
	serial_port_t *serial = serial_get_by_conn(conn);
	if (serial != NULL)
		serial_close(serial);
}

static void websocket_send_error(ws_message_opcode_t code, ws_cli_conn_t *conn) {
	char *error_msg;
error:
	error_msg = sp_last_error_message();
	if (error_msg == NULL) {
		WS_RESPONSE(code);
	} else {
		int error_len		   = strlen(error_msg);
		unsigned char *message = malloc(1 + error_len + 1);
		if (message == NULL) {
			WS_RESPONSE(code);
			return;
		}
		message[0] = code;
		strcpy(&message[1], error_msg);
		ws_sendframe_bin(conn, (const char *)message, 1 + error_len);
		free(message);
		sp_free_error_message(error_msg);
	}
}

void websocket_on_message(ws_cli_conn_t *conn, const unsigned char *msg, uint64_t msg_len, int msg_type) {
	if (msg_len < 1)
		return;
	uint8_t opcode	   = msg[0];
	ws_message_t *data = (ws_message_t *)(msg + 1);
	int data_len	   = msg_len - 1;

	serial_port_t *serial = NULL;
	if (opcode == WSM_PORT_OPEN) {
		// check auth_key string bounds
		if (memchr(&data->auth_key, '\0', data_len) == NULL) {
			WS_RESPONSE(WSM_ERR_AUTH);
			return;
		}
		// find object by auth_key
		if ((serial = serial_get_by_auth(data->auth_key)) == NULL) {
			WS_RESPONSE(WSM_ERR_AUTH);
			return;
		}
		// make sure it's closed
		if (serial->port != NULL) {
			WS_RESPONSE(WSM_ERR_IS_OPEN);
			return;
		}
	} else {
		// find object by WS connection
		if ((serial = serial_get_by_conn(conn)) == NULL) {
			WS_RESPONSE(WSM_ERR_NOT_OPEN);
			return;
		}
		// make sure it's open
		if (serial->port == NULL) {
			// allow closing twice
			if (opcode == WSM_PORT_CLOSE) {
				WS_RESPONSE(WSM_OK);
				return;
			}
			WS_RESPONSE(WSM_ERR_NOT_OPEN);
			return;
		}
	}

	switch (opcode) {
		case WSM_PORT_OPEN:
			if (!serial_open(serial, conn)) {
				serial_close(serial);
				goto error;
			}
			break;

		case WSM_PORT_CLOSE:
			// try to close the port
			if (!serial_close(serial))
				goto error;
			break;

		case WSM_SET_CONFIG:
			if (sp_set_baudrate(serial->port, data->baudrate) != SP_OK)
				goto error;
			if (sp_set_bits(serial->port, data->data_bits) != SP_OK)
				goto error;
			if (sp_set_parity(serial->port, data->parity) != SP_OK)
				goto error;
			if (sp_set_stopbits(serial->port, data->stop_bits) != SP_OK)
				goto error;
			break;

		case WSM_SET_SIGNALS:
			if (sp_set_dtr(serial->port, data->dtr) != SP_OK)
				goto error;
			if (sp_set_rts(serial->port, data->rts) != SP_OK)
				goto error;
			break;

		case WSM_GET_SIGNALS: {
			enum sp_signal signals;
			if (sp_get_signals(serial->port, &signals) != SP_OK)
				goto error;
			uint8_t response[2] = {WSM_OK, signals};
			ws_sendframe_bin(conn, (const char *)&response, 2);
			break;
		}

		case WSM_START_BREAK:
			if (sp_start_break(serial->port) != SP_OK)
				goto error;
			break;

		case WSM_END_BREAK:
			if (sp_end_break(serial->port) != SP_OK)
				goto error;
			break;

		case WSM_DATA:
			if (sp_blocking_write(serial->port, data->data, data_len - 1, 0) < 0)
				goto error;
			if (data->drain) {
				if (sp_drain(serial->port) != SP_OK)
					goto error;
			}
			break;

		case WSM_DRAIN:
			if (sp_drain(serial->port) != SP_OK)
				goto error;
			break;

		default:
			WS_RESPONSE(WSM_ERR_OPCODE);
			return;
	}

	WS_RESPONSE(WSM_OK);
	return;
error:
	websocket_send_error(WSM_ERROR, conn);
}

void *websocket_serial_thread(void *arg) {
	stdmsg_send_log("WS thread running");

	pthread_setcanceltype(PTHREAD_CANCEL_ASYNCHRONOUS, NULL);
	serial_port_t *serial = arg;
	uint8_t buf[4096 + 1];
	buf[0] = WSM_DATA;

	while (1) {
		struct sp_port *port = serial->port;
		if (port == NULL)
			goto error;
		if (sp_wait(serial->event_set, 1000) != SP_OK)
			goto error;
		int read = sp_nonblocking_read(port, buf + 1, sizeof(buf) - 1);
		if (read == 0)
			continue;
		if (read < 0)
			goto error;
		if (serial->conn == NULL)
			goto ret;
		ws_sendframe_bin(serial->conn, buf, read + 1);
	}

error:
	websocket_send_error(WSM_ERR_READER, serial->conn);
ret:
	serial->thread = 0;
	stdmsg_send_log("WS thread finished");
	return NULL;
}
