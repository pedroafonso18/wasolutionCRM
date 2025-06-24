package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func GetInstances(params WaSolParams) ApiResponse[InstancesResponse] {
	url := fmt.Sprintf("%s/retrieveInstances", params.Url)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return ApiResponse[InstancesResponse]{
			Success: false,
			Error:   "Failed to create request",
		}
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", params.Token))

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return ApiResponse[InstancesResponse]{
			Success: false,
			Error:   "Request failed",
		}
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return ApiResponse[InstancesResponse]{
			Success: false,
			Error:   "Failed to read response",
		}
	}

	var statusCheck struct {
		Status string `json:"status"`
	}

	if err := json.Unmarshal(body, &statusCheck); err != nil {
		return ApiResponse[InstancesResponse]{
			Success: false,
			Error:   "Failed to parse status",
		}
	}

	if statusCheck.Status == "error" {
		var errResp ErrorResponse
		if err := json.Unmarshal(body, &errResp); err != nil {
			return ApiResponse[InstancesResponse]{
				Success: false,
				Error:   "Failed to parse error response",
			}
		}
		return ApiResponse[InstancesResponse]{
			Success: false,
			Error:   fmt.Sprintf("%s: %s", errResp.Message, errResp.Error),
		}
	}

	var successResp struct {
		Status    string     `json:"status"`
		Count     int        `json:"count"`
		Instances []Instance `json:"instances"`
	}

	if err := json.Unmarshal(body, &successResp); err != nil {
		return ApiResponse[InstancesResponse]{
			Success: false,
			Error:   "Failed to parse success response",
		}
	}

	return ApiResponse[InstancesResponse]{
		Success: true,
		Data: &InstancesResponse{
			Count:     successResp.Count,
			Instances: successResp.Instances,
		},
	}
}

func CreateInstance(params WaSolParams, inst Instance) ApiResponse[GenericResponse] {
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

	body, err := json.Marshal(bodyMap)
	if err != nil {
		return ApiResponse[GenericResponse]{
			Success: false,
			Error:   "Failed to create body",
		}
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return ApiResponse[GenericResponse]{
			Success: false,
			Error:   "Failed to create request",
		}
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", params.Token))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return ApiResponse[GenericResponse]{
			Success: false,
			Error:   "Request failed",
		}
	}
	defer resp.Body.Close()

	body, err = io.ReadAll(resp.Body)
	if err != nil {
		return ApiResponse[GenericResponse]{
			Success: false,
			Error:   "Failed to read response",
		}
	}

	var statusCheck struct {
		Status string `json:"status"`
	}

	if err := json.Unmarshal(body, &statusCheck); err != nil {
		return ApiResponse[GenericResponse]{
			Success: false,
			Error:   "Failed to parse status",
		}
	}

	if statusCheck.Status == "error" {
		var errResp ErrorResponse
		if err := json.Unmarshal(body, &errResp); err != nil {
			return ApiResponse[GenericResponse]{
				Success: false,
				Error:   "Failed to parse error response",
			}
		}
		return ApiResponse[GenericResponse]{
			Success: false,
			Error:   fmt.Sprintf("%s: %s", errResp.Message, errResp.Error),
		}
	}

	var successResp struct {
		Status string `json:"status"`
	}

	if err := json.Unmarshal(body, &successResp); err != nil {
		return ApiResponse[GenericResponse]{
			Success: false,
			Error:   "Failed to parse success response",
		}
	}

	return ApiResponse[GenericResponse]{
		Success: true,
	}
}
