use maud::{html, Markup, DOCTYPE};

pub fn render() -> Markup {
    html! {
        (DOCTYPE)
        html {
            head {
                title { "Home" }
                script defer src="/static/router.js" {}
            }
            body {
                div id="app" {
                    h1 { "Welcome to the Homepage!" }
                    a href="/about" { "About Us" }
                    a href="/john" { "John's Profile" }
                }
            }
        }
    }
}
