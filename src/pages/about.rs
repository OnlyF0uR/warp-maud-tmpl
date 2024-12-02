use maud::{html, Markup, DOCTYPE};

pub fn render() -> Markup {
    html! {
        (DOCTYPE)
        html {
            head {
                title { "About Us" }
                script defer src="/static/router.js" {}
            }
            body {
                div id="app" {
                    h1 { "About Us" }
                    a href="/" { "Home" }
                }
            }
        }
    }
}
