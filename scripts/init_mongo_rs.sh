#!/bin/bash
echo "Initializing MongoDB Replica Set (rs0)..."

# Connect to the first pod (provider of the init command)
# Using kubectl to exec into mongodb-ha-0
kubectl exec -n ekaguru-dev mongodb-ha-0 -- mongosh --eval '
  rs.initiate({
    _id: "rs0",
    members: [
      { _id: 0, host: "mongodb-ha-0.mongodb-ha-headless.ekaguru-dev.svc.cluster.local:27017" },
      { _id: 1, host: "mongodb-ha-1.mongodb-ha-headless.ekaguru-dev.svc.cluster.local:27017" },
      { _id: 2, host: "mongodb-ha-2.mongodb-ha-headless.ekaguru-dev.svc.cluster.local:27017" }
    ]
  })
'

echo "Replica Set Initialized!"
