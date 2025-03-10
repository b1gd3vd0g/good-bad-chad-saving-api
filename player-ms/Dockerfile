# Define the OS image
# This image will already have node and npm installed.
FROM node:23-alpine
# Make the node_modules directory and change the owner of app to the node user
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
# Set working directory to where we're putting our app.
WORKDIR /home/node/app
# Copy the package.json and package-lock.json files so we can install our
# dependencies
COPY package*.json ./
# Install the dependencies
RUN npm i
# Copy the rest of the app
COPY . .
# Expose the port the app runs on
EXPOSE 6900
ENTRYPOINT [ "npm" ]
CMD [ "start" ]