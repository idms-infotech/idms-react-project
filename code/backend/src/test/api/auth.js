class AuthApi {
    constructor(client) {
        this.client = client;
    }
    async login(email, password) {
        const response = await this.client.request.post("api/v1/settings/user/login").send({
            email,
            password
        });
        expect(response.status).toBe(200);
        let body = response.body.result;
        expect(body).toHaveProperty("token");
        let token = response.body.result.token;
        expect(typeof token).toBe("string");
        return token;
    }
}

module.exports = AuthApi;
