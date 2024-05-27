FROM eclipse-temurin:20
RUN useradd -r java
WORKDIR /src
RUN chown java /src
USER java
ENV JSOUP_VER 1.13.1

RUN curl -SL https://jsoup.org/packages/jsoup-$JSOUP_VER.jar \
  -o jsoup-$JSOUP_VER.jar
COPY printheadlines.java /src/
RUN javac -cp /src/jsoup-$JSOUP_VER.jar:. \
  printheadlines.java
CMD java -cp jsoup-$JSOUP_VER.jar:. printheadlines

