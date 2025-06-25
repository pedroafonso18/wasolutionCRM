package redis

import "github.com/redis/go-redis/v9"

func ConnectRedis(redis_url string, redis_password string) (*redis.Client, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     redis_url,
		Password: redis_password,
	})
	return rdb, nil
}
