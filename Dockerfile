FROM node:4.6

RUN mkdir -p /blockchain/dist/
RUN mkdir -p /blockchain/src/
ADD package.json /blockchain/
ADD .babelrc /blockchain/
ADD .eslintrc.yaml /blockchain/
ADD tsconfig.json /blockchain/
COPY src/* /blockchain/src/

RUN cd /blockchain && npm install

EXPOSE 3001
EXPOSE 6001

ENTRYPOINT cd /blockchain && npm install && PEERS=$PEERS npm start