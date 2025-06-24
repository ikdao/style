document.addEventListener('click', (event) => {
    const copyTargetSelector = event.target.getAttribute('data-copy');
    if (!copyTargetSelector) return;
    const targetElement = document.querySelector(copyTargetSelector);
    if (!targetElement) return;
    const textToCopy = targetElement.value ?? targetElement.textContent;
    navigator.clipboard.writeText(textToCopy).catch(err => {
        console.error('Failed to copy text: ', err);
    });
});

//     <input id="shareLink" type="text" value="https://example.com/share">
//    <span data-copy="#shareLink">Copy Link</span>
//    <pre id="codeSnippet">function greet() { console.log('Hello, world!'); }</pre>
//    <button data-copy="#codeSnippet">Copy Code</button> 
