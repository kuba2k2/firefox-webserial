/* Copyright (c) Kuba Szczodrzyński 2023-08-22. */

#pragma once

#include "include.h"

#include "serial.h"

typedef enum {
	WSM_OK			 = 0,
	WSM_PORT_OPEN	 = 10,
	WSM_PORT_CLOSE	 = 11,
	WSM_SET_CONFIG	 = 20,
	WSM_SET_SIGNALS	 = 30,
	WSM_GET_SIGNALS	 = 31,
	WSM_START_BREAK	 = 40,
	WSM_END_BREAK	 = 41,
	WSM_DATA		 = 50,
	WSM_DRAIN		 = 51,
	WSM_ERROR		 = 128,
	WSM_ERR_OPCODE	 = 129,
	WSM_ERR_AUTH	 = 130,
	WSM_ERR_IS_OPEN	 = 131,
	WSM_ERR_NOT_OPEN = 132,
	WSM_ERR_READER	 = 133,
} ws_message_opcode_t;

typedef union {
	char auth_key[1];
	uint8_t signals;

	struct __attribute__((packed)) {
		uint32_t baudrate;
		uint8_t data_bits;
		uint8_t parity;
		uint8_t stop_bits;
	};

	struct __attribute__((packed)) {
		uint8_t dtr;
		uint8_t rts;
	};

	struct __attribute__((packed)) {
		bool drain;
		uint8_t data[1];
	};
} ws_message_t;

void websocket_start();
void websocket_on_open(ws_cli_conn_t *client);
void websocket_on_close(ws_cli_conn_t *client);
void websocket_on_message(ws_cli_conn_t *conn, const unsigned char *msg, uint64_t msg_len, int msg_type);
void *websocket_serial_thread(void *arg);
