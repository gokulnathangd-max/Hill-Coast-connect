# ==========================================
# STAGE 1: Build the Application (Maven)
# ==========================================
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy the source code files explicitly
COPY . .

# Compile and package the application into a JAR file, skipping tests for faster deployment
RUN mvn clean package -DskipTests

# ==========================================
# STAGE 2: Run the Application (JRE Runtime)
# ==========================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the compiled JAR file from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080 (the standard port Render looks for)
EXPOSE 8080

# Run the app with strict heap limitations optimized for Render's 512MB memory boundary
ENTRYPOINT ["sh", "-c", "java -Xmx256m -Xms128m $JAVA_OPTS -jar app.jar"]