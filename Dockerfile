# Turnkey image for the EGGIM labeling web app.
# Builds the Next.js app and serves it. Firebase keys are only needed by the
# (unused-here) schedule app; dummy build-only defaults let the build succeed.
# Pass real --build-arg NEXT_PUBLIC_FIREBASE_* if you also want the schedule app.

FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDUMMY_build_only_key_1234567890abcd
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dummy.firebaseapp.com
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID=dummy
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dummy.appspot.com
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
ARG NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:0000000000000000000000
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
    NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
RUN npm run build

FROM node:20-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV LABEL_DATA_DIR=/data/eggim
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
EXPOSE 3000
CMD ["npm", "run", "start"]
