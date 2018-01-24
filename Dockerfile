FROM node:9.4.0

COPY . /home/node/

WORKDIR /home/node

RUN npm i &&\
    npm run build

EXPOSE 3000

CMD npm start
