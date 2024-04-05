/* Copyright (c) Kuba Szczodrzyński 2023-08-22. */

#include "serial.h"

static const char *SP_TRANSPORT_STR[] = {
	[SP_TRANSPORT_NATIVE]	 = "NATIVE",
	[SP_TRANSPORT_USB]		 = "USB",
	[SP_TRANSPORT_BLUETOOTH] = "BLUETOOTH",
};

static serial_port_t *port_arr = NULL;
static int port_arr_len		   = 0;

cJSON *serial_list_ports_json() {
	struct sp_port **ports = NULL;
	if (sp_list_ports(&ports) != SP_OK)
		return NULL;

	cJSON *data = cJSON_CreateArray();
	if (data == NULL)
		goto end;

	for (int i = 0; ports[i] != NULL; i++) {
		struct sp_port *port = ports[i];

		cJSON *item = cJSON_CreateObject();
		if (item == NULL)
			goto end;

		char *id = serial_port_get_id(port);
		if (serial_port_fix_details != NULL)
			serial_port_fix_details(port, id);
		cJSON_AddStringToObject(item, "id", id);
		free(id);

		const char *name = sp_get_port_name(port);
		cJSON_AddStringToObject(item, "name", name);
		enum sp_transport transport = sp_get_port_transport(port);
		cJSON_AddStringToObject(item, "transport", SP_TRANSPORT_STR[transport]);

		if (serial_port_get_description != NULL) {
			char *description = serial_port_get_description(port);
			cJSON_AddStringToObject(item, "description", description);
			free(description);
		} else {
			const char *description = sp_get_port_description(port);
			cJSON_AddStringToObject(item, "description", description);
		}

		switch (transport) {
			case SP_TRANSPORT_NATIVE:
				break;

			case SP_TRANSPORT_USB: {
				cJSON *usb = cJSON_CreateObject();
				if (usb == NULL)
					goto end;
				if (cJSON_AddItemToObject(item, "usb", usb) == 0) {
					cJSON_Delete(usb);
					goto end;
				}

				int bus		= 0;
				int address = 0;
				if (sp_get_port_usb_bus_address(port, &bus, &address) == SP_OK) {
					cJSON_AddNumberToObject(usb, "bus", bus);
					cJSON_AddNumberToObject(usb, "address", address);
				}

				int vid = 0;
				int pid = 0;
				if (sp_get_port_usb_vid_pid(port, &vid, &pid) == SP_OK) {
					cJSON_AddNumberToObject(usb, "vid", vid);
					cJSON_AddNumberToObject(usb, "pid", pid);
				}

				const char *manufacturer = sp_get_port_usb_manufacturer(port);
				cJSON_AddStringToObject(usb, "manufacturer", manufacturer);
				const char *product = sp_get_port_usb_product(port);
				cJSON_AddStringToObject(usb, "product", product);
				const char *serial = sp_get_port_usb_serial(port);
				cJSON_AddStringToObject(usb, "serial", serial);
				break;
			}

			case SP_TRANSPORT_BLUETOOTH: {
				cJSON *bluetooth = cJSON_CreateObject();
				if (bluetooth == NULL)
					goto end;
				if (cJSON_AddItemToObject(item, "bluetooth", bluetooth) == 0) {
					cJSON_Delete(bluetooth);
					goto end;
				}

				const char *address = sp_get_port_bluetooth_address(port);
				cJSON_AddStringToObject(bluetooth, "address", address);
				break;
			}
		}

		cJSON_AddItemToArray(data, item);
	}

	sp_free_port_list(ports);
	return data;

end:
	sp_free_port_list(ports);
	cJSON_Delete(data);
	return NULL;
}

static char *serial_auth_make_key(const char *port_name) {
	UUID4_STATE_T state;
	UUID4_T uuid;
	uuid4_seed(&state);
	uuid4_gen(&state, &uuid);
	char *auth_key = malloc(UUID4_STR_BUFFER_SIZE);
	if (auth_key == NULL)
		return NULL;
	uuid4_to_s(uuid, auth_key, UUID4_STR_BUFFER_SIZE);
	return auth_key;
}

const char *serial_auth_grant(const char *port_name) {
	serial_port_t *serial = port_arr;
	for (int i = 0; i < port_arr_len; i++, serial++) {
		if (strcmp(port_name, serial->port_name) == 0) {
			if (serial->auth_key == NULL)
				serial->auth_key = serial_auth_make_key(port_name);
			return serial->auth_key;
		}
	}

	serial_port_t *prev = port_arr;
	port_arr			= realloc(port_arr, ++port_arr_len * sizeof(serial_port_t));
	if (port_arr == NULL) {
		free(prev);
		return NULL;
	}

	serial			  = &port_arr[port_arr_len - 1];
	serial->auth_key  = serial_auth_make_key(port_name);
	serial->port_name = strdup(port_name);
	serial->port	  = NULL;
	serial->conn	  = NULL;
	serial->thread	  = 0;
	serial->event_set = NULL;
	return serial->auth_key;
}

void serial_auth_revoke(const char *port_name) {
	serial_port_t *serial = port_arr;
	for (int i = 0; i < port_arr_len; i++, serial++) {
		if (strcmp(port_name, serial->port_name) == 0) {
			free(serial->auth_key);
			serial->auth_key = NULL;
		}
	}
}

serial_port_t *serial_get_by_auth(const char *auth_key) {
	serial_port_t *serial = port_arr;
	for (int i = 0; i < port_arr_len; i++, serial++) {
		if (strcmp(auth_key, serial->auth_key) != 0)
			continue;
		return serial;
	}
	return NULL;
}

serial_port_t *serial_get_by_conn(ws_cli_conn_t *conn) {
	serial_port_t *serial = port_arr;
	for (int i = 0; i < port_arr_len; i++, serial++) {
		if (serial->conn == conn)
			return serial;
	}
	return NULL;
}

bool serial_open(serial_port_t *serial, ws_cli_conn_t *conn) {
	if (sp_get_port_by_name(serial->port_name, &serial->port) != SP_OK)
		return false;

	if (sp_open(serial->port, SP_MODE_READ_WRITE) != SP_OK)
		return false;

	if (sp_new_event_set(&serial->event_set) != SP_OK)
		return false;
	if (sp_add_port_events(serial->event_set, serial->port, SP_EVENT_RX_READY) != SP_OK)
		return false;

	serial->conn = conn;

	if (pthread_create(&serial->thread, NULL, websocket_serial_thread, (void *)serial) != 0)
		return false;

	return true;
}

bool serial_close(serial_port_t *serial) {
	if (serial->event_set != NULL) {
		sp_free_event_set(serial->event_set);
		serial->event_set = NULL;
	}
	if (serial->port != NULL) {
		sp_close(serial->port);
		sp_free_port(serial->port);
		serial->port = NULL;
	}
	if (serial->thread != 0) {
		pthread_cancel(serial->thread);
		serial->thread = 0;
	}
	serial->conn = NULL;
	return true;
}
