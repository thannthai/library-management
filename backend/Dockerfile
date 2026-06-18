# Bước 1: Build file JAR bằng Maven
FROM maven:3.9.7-eclipse-temurin-22 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src

RUN mvn clean package -DskipTests

# Bước 2: Chạy ứng dụng bằng JRE siêu nhẹ
FROM eclipse-temurin:22-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]