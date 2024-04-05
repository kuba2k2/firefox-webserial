/* Copyright (c) Kuba Szczodrzyński 2023-08-22. */

#pragma once

#include <cJSON.h>
#include <libserialport.h>
#include <pthread.h>
#include <stdarg.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <uuid4.h>
#include <ws.h>

#include "webserial_config.h"

#include "serial.h"
#include "stdmsg.h"
#include "websocket.h"
