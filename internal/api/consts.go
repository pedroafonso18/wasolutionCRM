package api

type WaSolParams struct {
	Token string
	Url   string
}
type Instance struct {
	InstanceID    string `json:"instance_id"`
	InstanceName  string `json:"instance_name"`
	InstanceType  string `json:"instance_type"`
	IsActive      bool   `json:"is_active"`
	WebhookURL    string `json:"webhook_url"`
	WabaID        string `json:"waba_id,omitempty"`
	AccessToken   string `json:"access_token,omitempty"`
	PhoneNumberID string `json:"phone_number_id,omitempty"`
	ProxyUrl      string `json:"proxy_url,omitempty"`
}

type InstancesResponse struct {
	Count     int        `json:"count"`
	Instances []Instance `json:"instances"`
}

type GenericResponse struct {
	Message     string `json:"message"`
	ApiResponse string `json:"api_response"`
}

type ErrorResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Error   string `json:"error"`
}

type ApiResponse[T any] struct {
	Success bool   `json:"success"`
	Data    *T     `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}

type Message struct {
	InstanceId string
	Number     string
	Body       string
	Type       string
}

type CreateInstanceResponse struct {
	QrCode *CreateInstanceQrCode_ `json:"qrcode,omitempty"`
	Data   *CreateInstanceData_   `json:"data,omitempty"`
}

type CreateInstanceQrCode_ struct {
	Base64 string `json:"base64"`
}

type CreateInstanceData_ struct {
	QrCode string `json:"QRCode"`
}

type ConnectInstanceResponse struct {
	Base64 *string              `json:"base64,omitempty"`
	Data   *CreateInstanceData_ `json:"data,omitempty"`
}
