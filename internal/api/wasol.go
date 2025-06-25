package api

import (
	"fmt"
	"net/http"
)

func GetInstances(params WaSolParams) DetailedRequest {
	url := fmt.Sprintf("%s/retrieveInstances", params.Url)
	headers := map[string]string{
		"Authorization": fmt.Sprintf("Bearer %s", params.Token),
	}
	return DetailedRequest{
		Action:  "GetInstances",
		Method:  http.MethodGet,
		Url:     url,
		Headers: headers,
	}
}

func CreateInstance(params WaSolParams, inst Instance) DetailedRequest {
	url := fmt.Sprintf("%s/createInstance", params.Url)
	bodyMap := map[string]string{
		"instance_id":   inst.InstanceID,
		"instance_name": inst.InstanceName,
		"api_type":      inst.InstanceType,
	}
	if inst.WebhookURL != "" {
		bodyMap["webhook_url"] = inst.WebhookURL
	}
	if inst.ProxyUrl != "" {
		bodyMap["proxy_url"] = inst.ProxyUrl
	}
	if inst.AccessToken != "" {
		bodyMap["access_token"] = inst.AccessToken
	}
	if inst.WabaID != "" {
		bodyMap["waba_id"] = inst.WabaID
	}
	headers := map[string]string{
		"Authorization": fmt.Sprintf("Bearer %s", params.Token),
		"Content-Type":  "application/json",
	}
	return DetailedRequest{
		Action:  "CreateInstance",
		Method:  http.MethodPost,
		Url:     url,
		Headers: headers,
		Body:    bodyMap,
	}
}

func ConnectInstance(params WaSolParams, inst_id string) DetailedRequest {
	url := fmt.Sprintf("%s/connectInstance", params.Url)
	bodyMap := map[string]string{
		"instance_id": inst_id,
	}
	headers := map[string]string{
		"Authorization": fmt.Sprintf("Bearer %s", params.Token),
		"Content-Type":  "application/json",
	}
	return DetailedRequest{
		Action:  "ConnectInstance",
		Method:  http.MethodPost,
		Url:     url,
		Headers: headers,
		Body:    bodyMap,
	}
}

func SendMessage(params WaSolParams, msg Message) DetailedRequest {
	url := fmt.Sprintf("%s/sendMessage", params.Url)
	bodyMap := map[string]string{
		"instance_id": msg.InstanceId,
		"number":      msg.Number,
		"body":        msg.Body,
		"type":        msg.Type,
	}

	headers := map[string]string{
		"Authorization": fmt.Sprintf("Bearer %s", params.Token),
		"Content-Type":  "application/json",
	}

	return DetailedRequest{
		Action:  "SendMessage",
		Method:  http.MethodPost,
		Url:     url,
		Headers: headers,
		Body:    bodyMap,
	}
}

func DeleteInstance(params WaSolParams, instid string) DetailedRequest {
	url := fmt.Sprintf("%s/deleteInstance", params.Url)
	bodyMap := map[string]string{
		"instance_id": instid,
	}
	headers := map[string]string{
		"Authorization": fmt.Sprintf("Bearer %s", params.Token),
		"Content-Type":  "application/json",
	}
	return DetailedRequest{
		Action:  "DeleteInstance",
		Method:  http.MethodDelete,
		Url:     url,
		Headers: headers,
		Body:    bodyMap,
	}
}

func LogoutInstance(params WaSolParams, instid string) DetailedRequest {
	url := fmt.Sprintf("%s/logoutInstance", params.Url)
	bodyMap := map[string]string{
		"instance_id": instid,
	}
	headers := map[string]string{
		"Authorization": fmt.Sprintf("Bearer %s", params.Token),
		"Content-Type":  "application/json",
	}
	return DetailedRequest{
		Action:  "LogoutInstance",
		Method:  http.MethodDelete,
		Url:     url,
		Headers: headers,
		Body:    bodyMap,
	}
}

func ConfigWebhook(params WaSolParams, instid string, webhookUrl string) DetailedRequest {
	url := fmt.Sprintf("%s/setWebhook", params.Url)
	bodyMap := map[string]string{
		"instance_id": instid,
		"webhook_url": webhookUrl,
	}
	headers := map[string]string{
		"Authorization": fmt.Sprintf("Bearer %s", params.Token),
		"Content-Type":  "application/json",
	}
	return DetailedRequest{
		Action:  "ConfigWebhook",
		Method:  http.MethodDelete,
		Url:     url,
		Headers: headers,
		Body:    bodyMap,
	}
}
