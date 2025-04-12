document.addEventListener("DOMContentLoaded", () => {
    const quickContainer = document.getElementById('quick-container');
    const mergeContainer = document.getElementById('merge-container');
    const pauseBtn = document.getElementById('pause');
    const speedInput = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
  
    let quickArray = [];
    let mergeArray = [];
    let isPaused = false;
    let isSorting = false;
    let delay = 1000 / speedInput.value;
    let controller = null;
  
    function updateDelay(speed) {
      delay = 1000 / speed;
    }
  
    speedInput.addEventListener("input", (e) => {
      const speed = parseInt(e.target.value);
      speedValue.textContent = speed;
      updateDelay(speed);
    });
  
    pauseBtn.addEventListener("click", () => {
      isPaused = !isPaused;
      pauseBtn.innerText = isPaused ? "Resume" : "Pause";
    });
  
    function sleep(ms, signal) {
      return new Promise((resolve, reject) => {
        const wait = () => {
          if (signal.aborted) return reject(new Error("aborted"));
          if (!isPaused) {
            setTimeout(() => {
              if (signal.aborted) return reject(new Error("aborted"));
              resolve();
            }, ms);
          } else {
            setTimeout(wait, 100);
          }
        };
        wait();
      });
    }
  
    function drawBars(container, arr, activeIndices = []) {
      container.innerHTML = '';
      arr.forEach((value, index) => {
        const bar = document.createElement("div");
        bar.classList.add("bar");
        if (Array.isArray(activeIndices) && activeIndices.includes(index)) {
          bar.classList.add("active");
        }
        bar.style.height = `${value}px`;
        container.appendChild(bar);
      });
    }
  
    function generateArray(size = 60) {
      if (controller) controller.abort(); 
      isSorting = false;
  
      const baseArray = Array.from({ length: size }, () => Math.floor(Math.random() * 200) + 20);
      quickArray = [...baseArray];
      mergeArray = [...baseArray];
  
      drawBars(quickContainer, quickArray);
      drawBars(mergeContainer, mergeArray);
    }
  
    async function quickSort(arr, container, low, high, signal) {
      if (signal.aborted) return;
      if (low < high) {
        const pi = await quickPartition(arr, container, low, high, signal);
        await quickSort(arr, container, low, pi - 1, signal);
        await quickSort(arr, container, pi + 1, high, signal);
      }
    }
  
    async function quickPartition(arr, container, low, high, signal) {
      const pivot = arr[high];
      let i = low - 1;
  
      for (let j = low; j < high; j++) {
        if (signal.aborted) return;
        if (arr[j] < pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          drawBars(container, arr, [i, j]);
          await sleep(delay, signal);
        }
      }
  
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      drawBars(container, arr, [i + 1, high]);
      await sleep(delay, signal);
      return i + 1;
    }
  
    async function mergeSort(arr, container, start, end, signal) {
      if (signal.aborted) return;
      if (start >= end) return;
  
      const mid = Math.floor((start + end) / 2);
      await mergeSort(arr, container, start, mid, signal);
      await mergeSort(arr, container, mid + 1, end, signal);
      await merge(arr, container, start, mid, end, signal);
    }
  
    async function merge(arr, container, start, mid, end, signal) {
      const left = arr.slice(start, mid + 1);
      const right = arr.slice(mid + 1, end + 1);
      let i = 0, j = 0, k = start;
  
      while (i < left.length && j < right.length) {
        if (signal.aborted) return;
        const fromIndex = (left[i] < right[j]) ? i + start : j + mid + 1;
        arr[k] = (left[i] < right[j]) ? left[i++] : right[j++];
        drawBars(container, arr, [k, fromIndex]);
        await sleep(delay, signal);
        k++;
      }
  
      while (i < left.length) {
        if (signal.aborted) return;
        arr[k++] = left[i++];
        drawBars(container, arr, [k - 1]);
        await sleep(delay, signal);
      }
  
      while (j < right.length) {
        if (signal.aborted) return;
        arr[k++] = right[j++];
        drawBars(container, arr, [k - 1]);
        await sleep(delay, signal);
      }
    }
  
    document.getElementById("randomize").addEventListener("click", () => {
      if (isSorting && !isPaused) return; 
        
      generateArray();
    });
  
    document.getElementById("sort").addEventListener("click", async () => {
      if (isSorting) return;
  
      controller = new AbortController();
      const signal = controller.signal;
      isSorting = true;
  
      const quick = quickSort(quickArray, quickContainer, 0, quickArray.length - 1, signal);
      const merge = mergeSort(mergeArray, mergeContainer, 0, mergeArray.length - 1, signal);
  
      try {
        await Promise.all([quick, merge]);
      } catch (err) {
        console.log("Sorting aborted");
      }
  
      isSorting = false;
    });
  
    generateArray(); 
  });
  