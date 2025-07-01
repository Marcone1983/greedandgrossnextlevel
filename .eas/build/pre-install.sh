#!/bin/bash
# Force Java 17 for Gradle 8.6.0 compatibility
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

echo "Java version:"
java -version