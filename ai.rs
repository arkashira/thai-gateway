#[actix_web::test]
async fn test_health() {
    let app = App::new().service(health);
    let server = HttpServer::new(app).bind("127.0.0.1:8080").await.unwrap();
    let response = server.post("/health").send().await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(response.body_string().await.unwrap(), "Gateway is healthy");
}

#[actix_web::test]
async fn test_ai() {
    let app = App::new().service(ai);
    let server = HttpServer::new(app).bind("127.0.0.1:8080").await.unwrap();
    let response = server.post("/ai")
        .json(web::Json(Prompt { prompt: "Hello, World!".to_string() }))
        .send().await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(response.json::<String>().await.unwrap(), "Hello, World!");
}