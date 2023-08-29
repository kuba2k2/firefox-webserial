/* Copyright (c) Kuba Szczodrzyński 2023-08-22. */

#pragma once

#include "include.h"

void stdmsg_send_log(const char *fmt, ...);
void stdmsg_send_json(const char *id, cJSON *data);
void stdmsg_send_error(const char *id, int error);
int stdmsg_receive();
