



async function start() {

    const availability = await LanguageModel.availability();
    console.log(availability);

  
}

document.querySelector("#download").addEventListener("click", async() => {
      const session = await LanguageModel.create({
        monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
                console.log(`Downloaded ${e.loaded * 100}%`);
            });
        },
    });

})

start();