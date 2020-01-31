#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>

const char* ssid = "SSID";
const char* password = "password";

ESP8266WebServer server(80);

const int triggerPin = BUILTIN_LED;

void handleRoot() {
  server.send(200, "text/plain", "hello from esp8266!");
}
void setup(void){
  pinMode(triggerPin, OUTPUT); 
  digitalWrite(triggerPin, HIGH);
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.println("");

  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to ");
  Serial.println(ssid);
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  if (MDNS.begin("rocket")) {
    Serial.println("MDNS responder started");
  }

  server.on("/", handleRoot);

  server.on("/fire", [](){
    digitalWrite(triggerPin,LOW);
    delay(500);
    digitalWrite(triggerPin,HIGH);
    server.send(200, "text/plain", "FIRE");
  });

  server.begin();
  Serial.println("HTTP server started");
}

void loop(void){
  server.handleClient();
}
