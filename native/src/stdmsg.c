/* Copyright (c) Kuba Szczodrzyński 2023-08-22. */

#include "stdmsg.h"

static void stdmsg_write(cJSON *message) {
	char *json = cJSON_PrintUnformatted(message);
	if (json == NULL)
		return;
	uint32_t len = strlen(json);
	fwrite(&len, sizeof(uint32_t), 1, stdout);
	fwrite(json, sizeof(char), len, stdout);
	free(json);
}

void stdmsg_send_log(const char *fmt, ...) {
	va_list argv;
	va_start(argv, fmt);
	char data[256];
	vsnprintf(data, 256, fmt, argv);
	va_end(argv);

	cJSON *message = cJSON_CreateObject();
	if (message == NULL)
		goto end;
	if (cJSON_AddStringToObject(message, "data", data) == NULL)
		goto end;
	stdmsg_write(message);
end:
	cJSON_Delete(message);
	return;
}

void stdmsg_send_json(const char *id, cJSON *data) {
	cJSON *message = cJSON_CreateObject();
	if (message == NULL)
		goto end;
	if (cJSON_AddStringToObject(message, "id", id) == NULL)
		goto end;
	if (cJSON_AddItemToObject(message, "data", data) == 0)
		goto end;
	stdmsg_write(message);
end:
	cJSON_Delete(message);
	return;
}

void stdmsg_send_error(const char *id, int error) {
	cJSON *message = cJSON_CreateObject();
	if (message == NULL)
		goto end;
	if (id != NULL && cJSON_AddStringToObject(message, "id", id) == NULL)
		goto end;
	if (cJSON_AddNumberToObject(message, "error", error) == NULL)
		goto end;
	stdmsg_write(message);
end:
	cJSON_Delete(message);
	return;
}

void stdmsg_parse(char *json) {
	int error		   = 50;
	const char *action = NULL;
	const char *id	   = NULL;

	cJSON *message = cJSON_Parse(json);
	if (message == NULL)
		goto error;
	cJSON *j_action = cJSON_GetObjectItem(message, "action");
	if (j_action == NULL)
		goto error;
	cJSON *j_id = cJSON_GetObjectItem(message, "id");
	if (j_id == NULL)
		goto error;
	action = cJSON_GetStringValue(j_action);
	id	   = cJSON_GetStringValue(j_id);

	if (strcmp(action, "ping") == 0) {
		cJSON *data = cJSON_CreateObject();
		if (data == NULL) {
			error = 70;
			goto error;
		}
		if (cJSON_AddStringToObject(data, "version", NATIVE_VERSION) == NULL) {
			error = 71;
			goto error;
		}
		if (cJSON_AddNumberToObject(data, "protocol", NATIVE_PROTOCOL) == NULL) {
			error = 72;
			goto error;
		}
		if (cJSON_AddNumberToObject(data, "wsPort", WEBSOCKET_PORT) == NULL) {
			error = 73;
			goto error;
		}
		stdmsg_send_json(id, data);
	}

	else if (strcmp(action, "listPorts") == 0) {
		cJSON *data = serial_list_ports_json();
		if (data == NULL) {
			error = 60;
			goto error;
		}
		stdmsg_send_json(id, data);
	}

	else if (strcmp(action, "authGrant") == 0) {
		cJSON *port = cJSON_GetObjectItem(message, "port");
		if (port == NULL) {
			error = 61;
			goto error;
		}
		const char *auth_key = serial_auth_grant(cJSON_GetStringValue(port));
		cJSON *data			 = cJSON_CreateStringReference(auth_key);
		if (data == NULL) {
			error = 62;
			goto error;
		}
		stdmsg_send_json(id, data);
	}

	else if (strcmp(action, "authRevoke") == 0) {
		cJSON *port = cJSON_GetObjectItem(message, "port");
		if (port == NULL) {
			error = 63;
			goto error;
		}
		serial_auth_revoke(cJSON_GetStringValue(port));
		stdmsg_send_json(id, cJSON_CreateNull());
	}

	else {
		error = 51;
		goto error;
	}

	goto end;
error:
	stdmsg_send_error(id, error);
end:
	cJSON_Delete(message);
}

int stdmsg_receive() {
	uint32_t len = 0;
	fread((void *)&len, sizeof(uint32_t), 1, stdin);
	if (len == 0)
		return 0;
	if (len > 4096)
		return -1;

	char *json = malloc(len + 1);
	if (json == NULL)
		return -2;
	fread(json, sizeof(char), len, stdin);
	json[len] = '\0';

	stdmsg_parse(json);
	free(json);
	return len;
}
