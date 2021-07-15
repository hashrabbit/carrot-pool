#!/bin/sh
if [ ! -f config.json ]; then
  if [ -z "$AWS_ACCESS_KEY_ID" -o \
       -z "$AWS_SECRET_ACCESS_KEY" -o \
       -z "$AWS_DEFAULT_REGION" -o \
       -z "$APP_ENVIRONMENT" ]; then
    echo "ERROR: Cannot start hr-pool; no config.json present and external config variables missing. Aborting" >&2
    exit 1
  fi

  aws s3 cp "s3://hr-pool/${APP_ENVIRONMENT}/config.json" .
  aws s3 cp "s3://hr-pool/${APP_ENVIRONMENT}/configs" configs/ --recursive
fi

exec npm run start
