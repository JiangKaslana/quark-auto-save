// 配置项：替换为你的信息！
const CONFIG = {
    owner: "你的GitHub用户名",
    repo: "quark-auto-save",
    path: "links.json",
    token: "你的GitHub PAT令牌"
};

// 页面加载渲染列表
window.onload = () => renderLinkList();

// 渲染链接列表
async function renderLinkList() {
    const list = document.getElementById("linkList");
    list.innerHTML = "";
    try {
        const res = await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`);
        const data = await res.json();
        const content = atob(data.content);
        const linkData = JSON.parse(content);
        window.fileSha = data.sha; // 保存文件 SHA 用于更新

        linkData.links.forEach((link, index) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${link}</span>
                <button class="delete-btn" onclick="deleteLink(${index})">删除</button>
            `;
            list.appendChild(li);
        });
    } catch (err) {
        alert("加载列表失败：" + err.message);
    }
}

// 添加链接
async function addLink() {
    const input = document.getElementById("linkInput");
    const link = input.value.trim();
    if (!link || !link.includes("pan.quark.cn")) {
        alert("请输入有效的夸克分享链接！");
        return;
    }

    try {
        // 获取当前 links.json 内容
        const res = await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`);
        const data = await res.json();
        const content = atob(data.content);
        const linkData = JSON.parse(content);

        // 去重
        if (linkData.links.includes(link)) {
            alert("链接已存在！");
            input.value = "";
            return;
        }

        // 更新链接列表
        linkData.links.push(link);
        const newContent = JSON.stringify(linkData, null, 2);
        const base64Content = btoa(unescape(encodeURIComponent(newContent)));

        // 调用 GitHub API 提交
        const updateRes = await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`, {
            method: "PUT",
            headers: {
                "Authorization": `token ${CONFIG.token}`,
                "Accept": "application/vnd.github.v3+json"
            },
            body: JSON.stringify({
                message: "feat: 新增订阅链接",
                content: base64Content,
                sha: data.sha
            })
        });

        if (updateRes.ok) {
            alert("添加成功！");
            input.value = "";
            renderLinkList();
        } else {
            const err = await updateRes.json();
            alert("添加失败：" + err.message);
        }
    } catch (err) {
        alert("添加异常：" + err.message);
    }
}

// 删除链接
async function deleteLink(index) {
    if (!confirm("确定删除该链接吗？")) return;
    try {
        const res = await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`);
        const data = await res.json();
        const content = atob(data.content);
        const linkData = JSON.parse(content);

        // 删除对应索引链接
        linkData.links.splice(index, 1);
        const newContent = JSON.stringify(linkData, null, 2);
        const base64Content = btoa(unescape(encodeURIComponent(newContent)));

        // 提交修改
        const updateRes = await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`, {
            method: "PUT",
            headers: {
                "Authorization": `token ${CONFIG.token}`,
                "Accept": "application/vnd.github.v3+json"
            },
            body: JSON.stringify({
                message: "fix: 删除订阅链接",
                content: base64Content,
                sha: data.sha
            })
        });

        if (updateRes.ok) {
            alert("删除成功！");
            renderLinkList();
        } else {
            const err = await updateRes.json();
            alert("删除失败：" + err.message);
        }
    } catch (err) {
        alert("删除异常：" + err.message);
    }
}
