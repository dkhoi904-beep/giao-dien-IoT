// Set CORE_DEBUG_LEVEL = 3 first
#define ERA_DEBUG
#define ERA_SERIAL Serial

/* Select ERa host location (VN: Viet Nam, SG: Singapore) */
#define ERA_LOCATION_VN
// #define ERA_LOCATION_SG

// You should get Auth Token in the ERa App or ERa Dashboard
#define ERA_AUTH_TOKEN "df25ac35-78e8-454f-a6af-7124dc910f40"

/* Define setting button */
// #define BUTTON_PIN              0

#if defined(BUTTON_PIN)
    // Active low (false), Active high (true)
    #define BUTTON_INVERT       false
    #define BUTTON_HOLD_TIMEOUT 5000UL

    // This directive is used to specify whether the configuration should be erased.
    // If it's set to true, the configuration will be erased.
    #define ERA_ERASE_CONFIG    false
#endif

#include <Arduino.h>
#include <ERa.hpp>
#include <Automation/ERaSmart.hpp>
#include <Time/ERaEspTime.hpp>
#if defined(BUTTON_PIN)
    #include <pthread.h>
    #include <ERa/ERaButton.hpp>
#endif

//Declare pin 
#define bedLight 12
#define kitchenLight 19
#define livingLight 21
#define airConditioner 23

const char ssid[] = "eoh.io";
const char pass[] = "Eoh@2020";

WiFiClient mbTcpClient;

ERaEspTime syncTime;
ERaSmart smart(ERa, syncTime);

#if defined(BUTTON_PIN)
    ERaButton button;
    pthread_t pthreadButton;

    static void* handlerButton(void* args) {
        for (;;) {
            button.run();
            ERaDelay(10);
        }
        pthread_exit(NULL);
    }

#if ERA_VERSION_NUMBER >= ERA_VERSION_VAL(1, 2, 0)
    static void eventButton(uint8_t pin, ButtonEventT event) {
        if (event != ButtonEventT::BUTTON_ON_HOLD) {
            return;
        }
        ERa.switchToConfig(ERA_ERASE_CONFIG);
        (void)pin;
    }
#else
    static void eventButton(ButtonEventT event) {
        if (event != ButtonEventT::BUTTON_ON_HOLD) {
            return;
        }
        ERa.switchToConfig(ERA_ERASE_CONFIG);
    }
#endif

    void initButton() {
        pinMode(BUTTON_PIN, INPUT);
        button.setButton(BUTTON_PIN, digitalRead, eventButton,
                        BUTTON_INVERT).onHold(BUTTON_HOLD_TIMEOUT);
        pthread_create(&pthreadButton, NULL, handlerButton, NULL);
    }
#endif

/* This function will run every time ERa is connected */
ERA_CONNECTED() {
    ERA_LOG("ERa", "ERa connected!");
}

/* This function will run every time ERa is disconnected */
ERA_DISCONNECTED() {
    ERA_LOG("ERa", "ERa disconnected!");
}

/* This function print uptime every second */
void timerEvent() {
    ERA_LOG("Timer", "Uptime: %d", ERaMillis() / 1000L);
      int temperature = random(10, 31);
  ERa.virtualWrite(V0, temperature);
  
  // Thêm giá trị độ ẩm ngẫu nhiên (40% đến 80%)
  int humidity = random(40, 81);
  ERa.virtualWrite(V1, humidity);
}

ERA_WRITE(V2) {
    uint8_t value = param.getInt();
    digitalWrite( bedLight, value ? HIGH : LOW);
}
ERA_WRITE(V3) {
    int value = param.getInt();  // Nhận giá trị 0-100
    int pwmValue = map(value, 0, 100, 0, 255);  // Chuyển đổi sang dải PWM phù hợp
    analogWrite(kitchenLight, pwmValue);
}

ERA_WRITE(V4) {
    int value = param.getInt();
    int pwmValue = map(value, 0, 100, 0, 255);
    analogWrite(livingLight, pwmValue);
}

ERA_WRITE(V5) {
    int value = param.getInt();
    Serial.print("Receive data of V5: ");
    Serial.println(value);
    int pwmValue = map(value, 0, 100, 0, 255);
    analogWrite(airConditioner, value);
}


void setup() {
    /* Setup debug console */
#if defined(ERA_DEBUG)
    Serial.begin(115200);
#endif

#if defined(BUTTON_PIN)
    /* Initializing button. */
    initButton();
    /* Enable read/write WiFi credentials */
    ERa.setPersistent(true);
#endif

    /* Set board id */
    // ERa.setBoardID("Board_1");

    /* Setup Client for Modbus TCP/IP */
    ERa.setModbusClient(mbTcpClient);

    /* Set API task size. If this function is enabled,
       the core API will run on a separate task after disconnecting from the server
       (suitable for edge automation).*/
    ERa.setTaskSize(ERA_API_TASK_SIZE, true);

    /* Set scan WiFi. If activated, the board will scan
       and connect to the best quality WiFi. */
    ERa.setScanWiFi(true);
    pinMode(bedLight,OUTPUT);
    pinMode(kitchenLight,OUTPUT);
    pinMode(livingLight,OUTPUT);
    pinMode(airConditioner,OUTPUT);
    /* Initializing the ERa library. */
    ERa.begin(ssid, pass);

    /* Setup timer called function every second */
    ERa.addInterval(1000L, timerEvent);
}

void loop() {
    ERa.run();
}
