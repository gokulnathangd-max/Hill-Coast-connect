package com.hillcoast.hillcoast_connect.controller;

import com.hillcoast.hillcoast_connect.model.User;
import com.hillcoast.hillcoast_connect.repository.UserRepository;
import com.hillcoast.hillcoast_connect.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://192.168.56.1:3000"})
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> payload) {
        try {
            String username = payload.get("username");
            String email = payload.get("email");
            String password = payload.get("password");
            String role = payload.get("role");

            // 1. Validation Layer: Prevent identical identity tracking arrays
            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Username allocation matrix constraint conflict."));
            }

            // 2. Instantiate and map fields to your database model
            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(role); // Sets role exactly as string matching: ROLE_BUYER or ROLE_PRODUCER

            // 3. Persist and return the freshly saved account data
            User savedUser = userRepository.save(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
            
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Internal processing node failure: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPassword())) {
            User user = userOpt.get();
            
            // Generate token with both arguments (Username + String converted Role)
            String token = jwtUtil.generateToken(user.getUsername(), user.getRole().toString());

            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("userId", user.getId().toString());
            response.put("role", user.getRole().toString());
            
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid credentials"));
        }
    }
}