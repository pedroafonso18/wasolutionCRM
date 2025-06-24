package auth

type Token string

type LoginT struct {
	Login    string `json:"username"`
	Password string `json:"password"`
}

type User struct {
	JWT      Token
	IsAdmin  bool
	IsLogged bool
}
