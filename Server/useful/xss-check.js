function Xss(script){
        return script.toString().replace(/</g,"&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&#34;");
}

module.exports = {
    Xss,
};
