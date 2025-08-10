FROM node:22.14.0

WORKDIR /home
COPY . ./
RUN apt update && apt upgrade -y
RUN npm install && npm install -g pm2 

VOLUME ["/Volume1/docker/vavava", "/home/public"]

EXPOSE 32751

CMD ["npm", "run", "start"]
