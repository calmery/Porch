FROM node:9.4.0

COPY package.json /home/node
COPY package-lock.json /home/node

WORKDIR /home/node

RUN rm -rf node_modules &&\
    npm i --production

COPY src /home/node/src

EXPOSE 3000

CMD npm start
