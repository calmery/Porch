FROM node:9.4.0

COPY package.json /home/node
COPY package-lock.json /home/node

WORKDIR /home/node

RUN rm -rf node_modules &&\
    npm i

COPY . /home/node/

RUN npm run build

EXPOSE 3000

CMD npm start
