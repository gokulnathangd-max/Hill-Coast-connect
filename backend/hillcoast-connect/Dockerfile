# ==========================================
# STAGE 1: Build the Application (Maven)
# ==========================================
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Copy all backend contents into the container build directory
COPY . .

# Compile and package the application into a JAR file, skipping tests for faster deployment
RUN mvn clean package -DskipTests

# ==========================================
# STAGE 2: Run the Application (JRE Runtime)
# ==========================================
FROM openjdk:17-jdk-slim
WORKDIR /app

# Copy the compiled JAR file from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080 (the standard port Render looks for)
EXPOSE 8080

# Run the app using the memory-optimized options we set in Render
ENTRYPOINT ["sh", "-c", "java -Xmx256m -Xms128m $JAVA_OPTS -jar app.jar"]