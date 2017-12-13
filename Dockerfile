FROM python:3.6.3
MAINTAINER Marei Kikukawa <contact@calmery.me>

ENV http_proxy http://wwwproxy.cc.sojo-u.ac.jp:3128
ENV https_proxy $http_proxy
ENV ftp_proxy $http_proxy

RUN apt-get update &&\
		apt-get upgrade -y &&\
		apt-get install -y vim

RUN useradd -d /home/porch -m porch

USER porch

EXPOSE 5000

ENTRYPOINT ["/usr/bin/tail", "-f", "/dev/null"]
