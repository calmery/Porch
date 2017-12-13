FROM node:9.2.1
MAINTAINER Marei Kikukawa <contact@calmery.me>

ENV http_proxy http://wwwproxy.cc.sojo-u.ac.jp:3128
ENV https_proxy $http_proxy
ENV ftp_proxy $http_proxy

RUN apt-get update &&\
		apt-get upgrade --yes

USER node
EXPOSE 3000

ENTRYPOINT ["/usr/bin/tail", "-f", "/dev/null"]
