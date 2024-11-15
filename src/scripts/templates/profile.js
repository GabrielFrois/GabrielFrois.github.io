"use strict";

// Verifica se o usuário está logado
if (!currentUser) throw new Error("Usuário não logado!");

/* Função que gera o componente de perfil */
function genProfile() {
    const html = `
    <div class="profile-component hidden">
        <div class="close-button">×</div>
        <picture>
            <img src="${imagesPath}capy-pfp.webp" alt="Avatar genérico de capivara." />
        </picture>
        <div class="profile__name">${currentUserObj.name} ${currentUserObj.surname}</div>
        <p class="profile__message">Você precisa obter, no mínimo, 80% de acertos em mais <span class="profile__message__number-of-quizzes">${7 - numberOfPassedQuizzes}</span> de 7 questionários para emitir o seu certificado!</p>
        <button class="profile__certificate profile__certificate--disabled">Certificado</button>
        <div class="profile__account-actions">
            <button class="profile__logoff">Sair</button>
            <button class="profile__delete">Deletar Conta</button>
        </div>
    </div>
    `;
    document.querySelector(".overlay").insertAdjacentHTML("afterend", html);
}

/* INIT */
genProfile();

/* VARIÁVEIS */
const DOM_logoffButton = document.querySelector(".profile__logoff");
const DOM_profileModal = document.querySelector(".profile-component");
const DOM_profileMessage = document.querySelector(".profile__message");
const DOM_profileCertificateButton = document.querySelector(".profile__certificate");

/* Pequenos detalhes */
initProfile(); /* função que inicializa os detalhes do perfil */

/* EVENT LISTENERS */
DOM_profileCertificateButton.addEventListener("click", () => {
    if (DOM_profileCertificateButton.classList.contains("profile__certificate--disabled")) {
        console.log("Botão desabilitado: O usuário não completou todos os quizzes.");
        return;
    }
    getCertificate();
});

/* Funções */
function initProfile() {
    DOM_logoffButton.addEventListener("click", logoff);

    // Gerar o relatório de quizzes, se necessário
    if (numberOfPassedQuizzes !== 0) genReport();
    if (numberOfPassedQuizzes === 7) unlockCertificateButton(); // Desbloquear o botão de certificado

    /* Funções auxiliares */
    function logoff() {
        localStorage.clear();
        location.reload();
    }

    function genReport() {
        let html = `
        <ul class="profile__quizReport">
        </ul>
        `;
    
        DOM_profileMessage.insertAdjacentHTML("afterend", html); 
        const DOM_profileQuizReport = document.querySelector(".profile__quizReport");
        
        Object.entries(currentUserObj.passedQuizzes).forEach((arr) => {
            const quizObj = arr[1];
            html = `<li><b>${quizObj.pageTitle}</b> (<span>✅</span>)</li>` 
            DOM_profileQuizReport.insertAdjacentHTML("beforeend", html);
        });
    }

    function unlockCertificateButton() {
        DOM_profileMessage.textContent = "Parabéns! Você foi aprovado em todas as avaliações do curso e seu certificado já está liberado!";
        DOM_profileMessage.style.textAlign = "center";
        DOM_profileCertificateButton.classList.remove("profile__certificate--disabled");
    }
}

function getCertificate() {
    /* Carregar o jspdf e a imagem do template */
    console.log("Iniciando o processo de geração do certificado...");
    let certificate;
    const certificateName = `${currentUserObj.name} ${currentUserObj.surname}`;

    // Carregar os recursos
    const jspdfScript = document.createElement("script");
    const templateImage = document.createElement("img");

    // Carregar ambos os recursos de forma assíncrona
    Promise.all([
        loadResourcePromisified(jspdfScript, `${scriptsPath}/external/jspdf.js`),
        loadResourcePromisified(templateImage, `${imagesPath}certificate-template.jpeg`)
    ])
    .then(() => {
        console.log("Recursos carregados com sucesso!");
        
        // Criar o PDF
        certificate = new jspdf.jsPDF("landscape");
        const pageWidth = certificate.internal.pageSize.getWidth();
        const pageHeight = certificate.internal.pageSize.getHeight();
        certificate.addImage(templateImage, "JPEG", 0, 0, pageWidth, pageHeight);

        // Adicionar o nome no certificado
        const textWidth = certificate.getTextWidth(certificateName);
        const xPos = (pageWidth - textWidth) / 2.54;
        certificate.setFont("Times", "bolditalic");
        certificate.setFontSize(40);
        certificate.setTextColor(136, 189, 188);
        certificate.text(certificateName, xPos, pageHeight / 2.1);

        // Adicionar a data no certificado
        const dataAtual = formatarData();
        const dataWidth = certificate.getTextWidth(dataAtual);
        const xPosData = (pageWidth - dataWidth) / 2.54; // Centraliza a data
        certificate.setFont("Times", "normal");
        certificate.setFontSize(30);
        certificate.setTextColor(136, 189, 188);  // Cor da fonte
        certificate.text(`Data: ${dataAtual}`, xPosData, pageHeight / 1.8);

        // Salva o certificado gerado
        certificate.save("certificado-scrum.pdf");
    })
    .catch((err) => {
        console.error("Erro ao carregar recursos:", err);
    });
}

/* Função para carregar os recursos de forma assíncrona */
function loadResourcePromisified(element, src) {
    return new Promise((resolve, reject) => {
        element.onload = resolve;
        element.onerror = reject;
        element.src = src;
    });
}

/* Função para formatar a data atual */
function formatarData() {
    const data = new Date();
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

