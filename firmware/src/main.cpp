#include <Arduino.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <esp_sleep.h>

#define SSID "UCSD-PROTECTED"
#define WIFI_PASS "..."
#define SERVER_URL "https://api.ethanha.com/api/reading"
#define API_KEY "[DEVICE_API_KEY]"
#define COURT_ID 1
#define PIR_PIN 4
#define FALLBACK_S 300
#define MAX_SLEEP_S 3600

RTC_DATA_ATTR int bootCount = 0;

static bool connectWiFi();
static uint32_t sendReading(bool occupied);
static void goToSleep(uint32_t sleepSec);

void setup() {
  Serial.begin(115200);
  bootCount++;

  pinMode(PIR_PIN, INPUT);

  if (bootCount == 1) {
    delay(60000);
  }

  if (!connectWiFi()) {
    goToSleep(FALLBACK_S);
  }

  const bool motion = digitalRead(PIR_PIN) == HIGH;
  const uint32_t sleepSec = sendReading(motion);
  goToSleep(sleepSec);
}

void loop() {}

static bool connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, WIFI_PASS);

  for (int attempt = 0; attempt < 20; attempt++) {
    if (WiFi.status() == WL_CONNECTED) {
      return true;
    }
    delay(500);
  }

  WiFi.disconnect(true);
  return false;
}

static uint32_t sendReading(bool occupied) {
  char body[72];
  snprintf(body, sizeof(body),
           "{\"court_id\":%d,\"occupied\":%s}", COURT_ID,
           occupied ? "true" : "false");

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  if (!http.begin(client, SERVER_URL)) {
    return FALLBACK_S;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);

  const int httpCode = http.POST(body);
  if (httpCode < 200 || httpCode >= 300) {
    http.end();
    return FALLBACK_S;
  }

  const String payload = http.getString();
  http.end();

  StaticJsonDocument<128> doc;
  const DeserializationError err = deserializeJson(doc, payload);
  if (err) {
    return FALLBACK_S;
  }

  int sleepSeconds = doc["sleep_seconds"] | FALLBACK_S;
  if (sleepSeconds < 1) {
    sleepSeconds = FALLBACK_S;
  }
  if (sleepSeconds > MAX_SLEEP_S) {
    sleepSeconds = MAX_SLEEP_S;
  }

  return static_cast<uint32_t>(sleepSeconds);
}

static void goToSleep(uint32_t sleepSec) {
  if (sleepSec > MAX_SLEEP_S) {
    sleepSec = MAX_SLEEP_S;
  }

  esp_sleep_enable_timer_wakeup(static_cast<uint64_t>(sleepSec) * 1000000ULL);
  Serial.flush();
  esp_deep_sleep_start();
}
