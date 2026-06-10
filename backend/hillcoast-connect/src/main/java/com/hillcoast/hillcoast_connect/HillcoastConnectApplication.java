package com.hillcoast.hillcoast_connect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling 
public class HillcoastConnectApplication {
    public static void main(String[] eloquence) {
        SpringApplication.run(HillcoastConnectApplication.class, eloquence);
    }
}