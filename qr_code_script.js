document.addEventListener('DOMContentLoaded', function() {
    const qrCodeDiv = document.getElementById("qrCode1");
    if (!qrCodeDiv) {
        console.error('QR 코드를 위한 DOM 요소를 찾을 수 없습니다.');
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    fetch(`/api/registration_info?code=${code}`)
        .then(response => response.json())
        .then(data => {
            if (!data) {
                throw new Error('등록 정보가 비어 있습니다.');
            }
            document.getElementById('ownerName').textContent = data.ownerName;
            document.getElementById('address').textContent = data.address;
            document.getElementById('registrationCode').textContent = data.registrationCode;
            new QRCode(qrCodeDiv, {
                text: data.registrationCode,
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        })
        .catch(error => {
            console.error('등록 정보를 가져오는데 실패하였거나 QR 코드 생성에 실패하였습니다:', error);
        });
});
