function api(t, e) {
    return e || (e = {}), new Promise(function(o, a) {
        var n = new XMLHttpRequest;
        n.open("GET", "https://vk.com/dev/execute", !0), n.onreadystatechange = function() {
            if (4 == n.readyState) {
                var r = n.responseText.match(/Dev\.methodRun\(\'([a-z0-9\:]+)/im);
                if (!r) return a("Invalid hash");
                var c = new FormData;
                if (c.set("act", "a_run_method"), c.set("al", 1), c.set("hash", r[1]), c.set("method", "execute"), c.set("param_code", "execute" == t ? e.code : "return API." + t + "(" + JSON.stringify(e) + ");"), c.set("param_v", "5.60"), "execute" == t)
                    for (var s in e) c.set("param_" + s, e[s]);
                var i = new XMLHttpRequest;
                i.open("POST", "https://vk.com/dev", !0), i.onreadystatechange = function() {
                    if (4 == i.readyState) {
                        if (200 !== n.status) return a("I/O Error", n.status);
                        var t = i.response;
                        try {
                            t = JSON.parse(i.response.replace(/^.+?\{/, "{"))
                        } catch (t) {}
                        t.response ? o(t.response) : a(t)
                    }
                }, i.send(c)
            }
        }, n.send()
    })
}
var app = {
    log: console.log.bind(console, "log>"),
    save: function() {
        chrome.storage.local.set(app.data)
    },
    data: {
        collections: {},
        history: [],
        text: !1,
        collect: !1
    },
    toHistory: function(t) {
        app.data.history.filter(function(e) {
            return e[0] == t
        }).length > 0 || (app.data.history.unshift(Array.from(arguments)), app.data.history.length > 10 && app.data.history.pop(), update_context(), app.save())
    },
    onCheck: function(t, e) {
        app.data[t] = e.checked, app.save()
    },
    toId: function(t) {
        return "photo" + t.owner_id + "_" + t.id
    },
    download: function(t) {
        return new Promise(function(e, o) {
            var a = new XMLHttpRequest;
            a.open("GET", t, !0), a.responseType = "blob", a.onreadystatechange = function() {
                if (4 == a.readyState) return 200 !== a.status ? o("I/O Error", a.status) : void e(a.response)
            }, a.send()
        })
    },
    toDial: function(t, e) {
        return app.upload({
            peer_id: t,
            name: "photo",
            getServer: "photos.getMessagesUploadServer",
            save_method: "photos.saveMessagesPhoto",
            src: e.srcUrl
        }).then(function(e) {
            app.data.collections[t] || (app.data.collections[t] = []);
            var o = app.data.collections[t].push(app.toId(e[0]));
            if (!app.data.collect || confirm("В буфере " + o + " фото.\nЗапостить фото?")) return api("messages.send", {
                peer_id: t,
                message: app.data.text ? prompt("Пожалуйста, введите текст сообщения") : "",
                attachment: app.data.collections[t].join(",")
            }).then(function() {
                app.data.collections[t] = []
            })
        }).then(function(t) {
            chrome.browserAction.setBadgeText({
                text: "Сохранено"
            })
        }).catch(function(t) {
            console.error(t), chrome.browserAction.setBadgeText({
                text: "Ошибка :c"
            })
        })
    },
    toWall: function(t, e) {
        return app.upload({
            getServerData: t < 0 ? {
                group_id: -t
            } : {},
            name: "photo",
            getServer: "photos.getWallUploadServer",
            save_method: "photos.saveWallPhoto",
            src: e.srcUrl
        }).then(function(e) {
            app.data.collections["wall" + t] || (app.data.collections["wall" + t] = []);
            var o = app.data.collections["wall" + t].push(app.toId(e[0]));
            if (!app.data.collect || confirm("В буфере " + o + " фото.\nЗапостить фото?")) return api("wall.post", {
                owner_id: t,
                message: app.data.text ? prompt("Введите текст записи") : "",
                attachment: app.data.collections["wall" + t].join(",")
            }).then(function() {
                app.data.collections["wall" + t] = []
            })
        }).then(function(t) {
            chrome.browserAction.setBadgeText({
                text: "Сохранено"
            })
        }).catch(function(t) {
            console.error(t), chrome.browserAction.setBadgeText({
                text: "Ошибка :c"
            })
        })
    },
    toAlbum: function(t, e) {
        return app.upload({
            getServerData: {
                album_id: t
            },
            caption: app.data.text ? prompt("Введите описание фото") : "",
            name: "photo",
            getServer: "photos.getUploadServer",
            save_method: "photos.save",
            src: e.srcUrl
        }).then(function(t) {
            chrome.browserAction.setBadgeText({
                text: "Сохранено"
            })
        })
    },
    upload: function(t) {
        return chrome.browserAction.setBadgeText({
            text: "Получение сервера..."
        }), Promise.all([api(t.getServer, t.getServerData), app.download(t.src)]).then(function(e) {
            return chrome.browserAction.setBadgeText({
                text: "Загрузка..."
            }), new Promise(function(o, a) {
                xhr = new XMLHttpRequest, xhr.open("POST", e[0].upload_url, !0), xhr.onreadystatechange = function() {
                    if (4 == xhr.readyState) {
                        if (200 !== xhr.status) return a("I/O Error", xhr.status);
                        var t = xhr.response;
                        try {
                            t = JSON.parse(xhr.responseText)
                        } catch (t) {}
                        o(t)
                    }
                };
                var n = new FormData;
                n.set(t.name, new Blob([e[1]]), "file.png"), xhr.send(n)
            })
        }).then(function(e) {
            return chrome.browserAction.setBadgeText({
                text: "Сохранение..."
            }), api(t.save_method, Object.assign(e, t.getServerData, {
                caption: t.caption
            }))
        }).catch(function(t) {
            console.error(t), chrome.browserAction.setBadgeText({
                text: "Ошибка :c"
            })
        })
    }
};

function update_context() {
    chrome.contextMenus.removeAll(), api("users.get").then(function(t) {
        if (chrome.contextMenus.create({
                title: t[0].first_name + " " + t[0].last_name,
                contexts: ["image"],
                onclick: function() {
                    open("https://vk.com/id" + t[0].id)
                }
            }), app.data.history.length) {
            var e = chrome.contextMenus.create({
                title: "История",
                contexts: ["image"]
            });
            app.data.history.map(function(t) {
                return chrome.contextMenus.create({
                    parentId: e,
                    title: t[0],
                    contexts: ["image"],
                    onclick: app[t[1]].bind(this, t[2])
                })
            })
        }
        return api("execute", {
            code: '\t\t\tvar o = {d:API.messages.getDialogs({count:20}).items@.message};\t\t\to.p=API.users.get({user_ids:o.d@.user_id,name_case:"dat"});\t\t\tvar ids = o.d@.user_id;\t\t\tvar ids_length = ids.length+1;\t\t\tvar p = [];\t\t\twhile(ids_length=ids_length-1)\t\t\t\t\tp.push(-ids[ids_length-1]);\t\t\to.g = API.groups.getById({group_ids:p});\t\t\to.a = API.photos.getAlbums({count:20});\t\t\to.w = API.groups.get({extended:1,filter:"admin"});\t\t\to.f = API.friends.get({count:20,name_case:"dat",fields:"last_name",order:"hints"});\t\t\treturn o;'.replace(/\t+/g, "\n")
        })
    }).then(function(t) {
        var e = {};
        t.p.map(function(t) {
            e[t.id] = t.first_name + " " + t.last_name
        }), t.g && t.g.map(function(t) {
            e[-t.id] = t.name
        });
        var o = chrome.contextMenus.create({
            title: "В диалог",
            contexts: ["image"]
        });
        t.d.map(function(t) {
            t.peer_id = t.chat_id ? t.chat_id + 2e9 : t.user_id, t.name = t.chat_id ? t.title : e[t.user_id] || t.user_id.toString(), chrome.contextMenus.create({
                parentId: o,
                title: t.name,
                contexts: ["image"],
                onclick: function(e) {
                    app.toHistory("В диалог " + t.name, "toDial", t.peer_id), app.toDial(t.peer_id, e)
                }
            })
        });
        var a = chrome.contextMenus.create({
            title: "В альбом",
            contexts: ["image"]
        });
        t.a.items.map(function(t) {
            return chrome.contextMenus.create({
                title: t.title,
                parentId: a,
                contexts: ["image"],
                onclick: function(e) {
                    app.toHistory("В альбом " + t.title, "toAlbum", t.id), app.toAlbum(t.id, e)
                }
            })
        });
        var n = chrome.contextMenus.create({
            title: "Другу",
            contexts: ["image"]
        });
        t.f.items.map(function(t) {
            return chrome.contextMenus.create({
                title: t.first_name + " " + t.last_name,
                parentId: n,
                contexts: ["image"],
                onclick: function(e) {
                    app.toHistory("В диалог " + t.first_name + " " + t.last_name, "toDial", t.id), app.toDial(t.id, e)
                }
            })
        });
        var r = chrome.contextMenus.create({
            title: "На стену",
            contexts: ["image"]
        });
        chrome.contextMenus.create({
            title: "Свою",
            parentId: r,
            contexts: ["image"],
            onclick: function(t) {
                app.toHistory("На свою стену", "toWall", 0), app.toWall(0, t)
            }
        }), t.w.items.map(function(t) {
            return chrome.contextMenus.create({
                title: t.name,
                parentId: r,
                contexts: ["image"],
                onclick: function(e) {
                    app.toHistory("На стену " + t.name, "toWall", -t.id), app.toWall(-t.id, e)
                }
            })
        })
    }).then(function() {
        chrome.contextMenus.create({
            type: "checkbox",
            title: "Запрашивать текст",
            contexts: ["image"],
            checked: app.data.text,
            onclick: app.onCheck.bind(this, "text")
        }), chrome.contextMenus.create({
            type: "checkbox",
            title: "Запрашивать отправку (Сохранять в буфер)",
            checked: app.data.collect,
            contexts: ["image"],
            onclick: app.onCheck.bind(this, "collect")
        }), chrome.contextMenus.create({
            title: "Обновить меню",
            contexts: ["image"],
            onclick: update_context
        })
    }).catch(function(t) {
        console.error(t), chrome.contextMenus.create({
            title: "Обновить меню",
            contexts: ["image"],
            onclick: update_context
        }), chrome.contextMenus.create({
            title: "Ошибка :C",
            contexts: ["image"]
        })
    })
}
update_context(), chrome.browserAction.setBadgeText({
    text: ""
}), chrome.storage.local.get(function(t) {
    Object.assign(app.data, t), console.log("settings restored", t)
});