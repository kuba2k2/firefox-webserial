/* Copyright (c) Kuba Szczodrzyński 2023-08-22. */

#pragma once

#include "include.h"

typedef struct {
	char *auth_key;
	char *port_name;
	struct sp_port *port;
	ws_cli_conn_t *conn;
	pthread_t thread;
	struct sp_event_set *event_set;
} serial_port_t;

cJSON *serial_list_ports_json();

const char *serial_auth_grant(const char *port_name);
void serial_auth_revoke(const char *port_name);

char *serial_port_get_id(struct sp_port *port);
__attribute__((weak)) char *serial_port_get_description(struct sp_port *port);
__attribute__((weak)) void serial_port_fix_details(struct sp_port *port, const char *id);

serial_port_t *serial_get_by_auth(const char *auth_key);
serial_port_t *serial_get_by_conn(ws_cli_conn_t *conn);

bool serial_open(serial_port_t *serial, ws_cli_conn_t *conn);
bool serial_close(serial_port_t *serial);
