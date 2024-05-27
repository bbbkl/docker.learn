mongo admin --username dockerbuch --password secret \
	--eval "db.createUser({user: 'geonames', pwd: 'geheim',
      roles: [{role: 'readWrite', db: 'geonames'}]})"
