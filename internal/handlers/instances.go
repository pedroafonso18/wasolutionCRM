package api

import (
	"WaSolCRM/config"
	"WaSolCRM/internal/api"
	"WaSolCRM/internal/rabbit"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
)

func GetInstancesHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("GetInstancesHandler called")

	cfg := config.LoadConfig()

	wasolParams := api.WaSolParams{
		Token: cfg.WaSolKey,
		Url:   cfg.WaSolUrl,
	}

	request := api.GetInstances(wasolParams)

	resp, err := makeHTTPRequest(request)
	if err != nil {
		log.Printf("HTTP request error: %v", err)
		http.Error(w, "Failed to get instances", 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Authorization", fmt.Sprintf("Bearer %s", cfg.WaSolKey))
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	w.WriteHeader(http.StatusOK)
	w.Write(resp)
}

func CreateInstanceHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("CreateInstanceHandler called")

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		InstanceID   string `json:"instanceId"`
		InstanceName string `json:"instanceName"`
		InstanceType string `json:"instanceType"`
		WebhookURL   string `json:"webhookUrl,omitempty"`
		ProxyUrl     string `json:"proxyUrl,omitempty"`
		AccessToken  string `json:"accessToken,omitempty"`
		WabaID       string `json:"wabaId,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("JSON decode error: %v", err)
		http.Error(w, "Invalid request body", 400)
		return
	}

	if req.InstanceID == "" || req.InstanceName == "" || req.InstanceType == "" {
		http.Error(w, "Missing required fields", 400)
		return
	}

	cfg := config.LoadConfig()

	instance := api.Instance{
		InstanceID:   req.InstanceID,
		InstanceName: req.InstanceName,
		InstanceType: req.InstanceType,
		WebhookURL:   req.WebhookURL,
		ProxyUrl:     req.ProxyUrl,
		AccessToken:  req.AccessToken,
		WabaID:       req.WabaID,
	}

	wasolParams := api.WaSolParams{
		Token: cfg.WaSolKey,
		Url:   cfg.WaSolUrl,
	}

	request := api.CreateInstance(wasolParams, instance)

	resp, err := makeHTTPRequest(request)
	if err != nil {
		log.Printf("HTTP request error: %v", err)
		http.Error(w, "Failed to create instance", 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Authorization", fmt.Sprintf("Bearer %s", cfg.WaSolKey))
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	w.WriteHeader(http.StatusOK)
	w.Write(resp)
	log.Printf("Raw response: %s", string(resp))
}

func ConnectInstanceHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("ConnectInstanceHandler called")

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		InstanceID string `json:"instanceId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("JSON decode error: %v", err)
		http.Error(w, "Invalid request body", 400)
		return
	}

	if req.InstanceID == "" {
		http.Error(w, "Missing instanceId", 400)
		return
	}

	cfg := config.LoadConfig()

	wasolParams := api.WaSolParams{
		Token: cfg.WaSolKey,
		Url:   cfg.WaSolUrl,
	}

	request := api.ConnectInstance(wasolParams, req.InstanceID)

	resp, err := makeHTTPRequest(request)
	if err != nil {
		log.Printf("HTTP request error: %v", err)
		http.Error(w, "Failed to connect instance", 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Authorization", fmt.Sprintf("Bearer %s", cfg.WaSolKey))
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	w.WriteHeader(http.StatusOK)
	w.Write(resp)
}

func DeleteInstanceHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("DeleteInstanceHandler called")

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		InstanceID string `json:"instanceId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("JSON decode error: %v", err)
		http.Error(w, "Invalid request body", 400)
		return
	}

	if req.InstanceID == "" {
		http.Error(w, "Missing instanceId", 400)
		return
	}

	cfg := config.LoadConfig()

	wasolParams := api.WaSolParams{
		Token: cfg.WaSolKey,
		Url:   cfg.WaSolUrl,
	}

	request := api.DeleteInstance(wasolParams, req.InstanceID)

	ch, err := rabbit.ConnectRabbit(cfg.RabbitMQ)
	if err != nil {
		log.Printf("RabbitMQ connection error: %v", err)
		http.Error(w, "Failed to connect to RabbitMQ", 500)
		return
	}
	defer ch.Close()

	err = rabbit.SendToQueue(ch, request)
	if err != nil {
		log.Printf("SendToQueue error: %v", err)
		http.Error(w, "Failed to queue delete request", 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Authorization", fmt.Sprintf("Bearer %s", cfg.WaSolKey))
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"success": "Delete request queued successfully"})
}

func LogoutInstanceHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("LogoutInstanceHandler called")

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		InstanceID string `json:"instanceId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("JSON decode error: %v", err)
		http.Error(w, "Invalid request body", 400)
		return
	}

	if req.InstanceID == "" {
		http.Error(w, "Missing instanceId", 400)
		return
	}

	cfg := config.LoadConfig()

	wasolParams := api.WaSolParams{
		Token: cfg.WaSolKey,
		Url:   cfg.WaSolUrl,
	}

	request := api.LogoutInstance(wasolParams, req.InstanceID)

	ch, err := rabbit.ConnectRabbit(cfg.RabbitMQ)
	if err != nil {
		log.Printf("RabbitMQ connection error: %v", err)
		http.Error(w, "Failed to connect to RabbitMQ", 500)
		return
	}
	defer ch.Close()

	err = rabbit.SendToQueue(ch, request)
	if err != nil {
		log.Printf("SendToQueue error: %v", err)
		http.Error(w, "Failed to queue logout request", 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Authorization", fmt.Sprintf("Bearer %s", cfg.WaSolKey))
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"success": "Logout request queued successfully"})
}

func ConfigWebhookHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("ConfigWebhookHandler called")

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		InstanceID string `json:"instanceId"`
		WebhookURL string `json:"webhookUrl"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("JSON decode error: %v", err)
		http.Error(w, "Invalid request body", 400)
		return
	}

	if req.InstanceID == "" || req.WebhookURL == "" {
		http.Error(w, "Missing instanceId or webhookUrl", 400)
		return
	}

	cfg := config.LoadConfig()

	wasolParams := api.WaSolParams{
		Token: cfg.WaSolKey,
		Url:   cfg.WaSolUrl,
	}

	request := api.ConfigWebhook(wasolParams, req.InstanceID, req.WebhookURL)

	ch, err := rabbit.ConnectRabbit(cfg.RabbitMQ)
	if err != nil {
		log.Printf("RabbitMQ connection error: %v", err)
		http.Error(w, "Failed to connect to RabbitMQ", 500)
		return
	}
	defer ch.Close()

	err = rabbit.SendToQueue(ch, request)
	if err != nil {
		log.Printf("SendToQueue error: %v", err)
		http.Error(w, "Failed to queue webhook config request", 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Authorization", fmt.Sprintf("Bearer %s", cfg.WaSolKey))
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"success": "Webhook config request queued successfully"})
}

func makeHTTPRequest(request api.DetailedRequest) ([]byte, error) {
	client := &http.Client{}

	var req *http.Request
	var err error

	if request.Method == "GET" {
		req, err = http.NewRequest(request.Method, request.Url, nil)
	} else {
		contentType := ""
		for key, value := range request.Headers {
			if strings.ToLower(key) == "content-type" {
				contentType = value
				break
			}
		}

		if strings.Contains(contentType, "application/json") {
			jsonData, err := json.Marshal(request.Body)
			if err != nil {
				return nil, err
			}
			req, err = http.NewRequest(request.Method, request.Url, strings.NewReader(string(jsonData)))
		} else {
			data := url.Values{}
			for key, value := range request.Body {
				data.Set(key, value)
			}
			req, err = http.NewRequest(request.Method, request.Url, strings.NewReader(data.Encode()))
			if err == nil {
				req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			}
		}
	}

	if err != nil {
		return nil, err
	}

	for key, value := range request.Headers {
		req.Header.Set(key, value)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return body, nil
}
