docker login --username $DOCKER_USER \
             --password $DOCKER_PASSWORD 

docker tag anypay/pool.paypow.com anypay/pool.paypow.com:$CIRCLE_BRANCH

docker push anypay/pool.paypow.com:$CIRCLE_BRANCH

