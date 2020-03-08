FROM node:10

# Create lorebot user
RUN useradd -ms /bin/bash lorebot

# Create /code directory for lorebot soure and set it to the current working directory
RUN mkdir -p /code \
        && chown lorebot:lorebot /code
WORKDIR /code

# Copy npm dependency tree
COPY ./package.json /code/

# Make npm installs less noisy
RUN npm set progress=false

# Install npm packages
RUN npm install moment
RUN npm install babel-polyfill

# Install lorebot
RUN npm install -s

# Copy lorebot source
COPY ./lorebot.js /code/
COPY ./sql /code/sql
COPY ./utility /code/utility

# Copy lorebot configs
# COPY ./config.json /code/

# Start lorebot when the container is run without a command argument
CMD npm start
