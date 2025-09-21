const fs = require('fs');

// Create placeholder PNG files using base64 encoded minimal PNGs
const sizes = [16, 48, 128];
const colors = { normal: [102, 126, 234], recording: [255, 68, 88] };

// Minimal 1x1 PNG in different colors as base64
const png16 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABdSURBVDiN7ZAxDoAgDEWfaDTxLl7FuMtJvIpHkbgpg5tpAIPBgYF/atL+l7YUKBQsBJkAAsDJG5L1bgHgJkk5LxvvDdAD6DQAmWsAbIFJA5BVhVgsVn/8FeAPTNsBLoshI0l3AH0AAAAASUVORK5CYII=', 'base64');
const png48 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADZSURBVGiB7ZmxDcIwEEV/ECUFEzABbMAIrJERGIERGIEVWIEFKOko6VJAkahIcXznJPykK3K/z++dLZ8N/BkpUAPNwCmBxzUv5WAGYOVADBwdcwUXRaAFPkAfOI0LvEjAA1hGBGxRBRJghyr0BqYRAbcI7/QKJlO1aw3U6OeTM1C4BjIXbQ8wzRiB2kWrkJuNRQTO+IXnQuMi5HWlhzK6AvtQ4TIvJGCPLtB0CtShwqEesoA9ykDrInQOtlX+lQEr4IX+kDKgBFxvxCAv4IQ+4y2wjRUu80JWwKgxAdejKsT8dhzfAAAAAElFTkSuQmCC', 'base64');
const png128 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGkSURBVHic7d3BbsIwDAbgP4jHYC/AS7CHYdJE4cSOvAzMy3DkxG0aB7otbaEt/b7vRBPHcRQ3DaRJAAAAAAAAAAAAAAAAAGAOS3dLKnVvyH1KqbquK1dVhTFGGGOE976xrbVCv8eqyKyB3vt2oL33jW0YhmEc11hKKVdVhXPO9eq+PW17j3URqgOglIqiKIQQQnieJ621+vl8miGYBuCca29rrcW3PQB1AFKpxM/PD2+MyZumucl83hV3fGPM9ZXHGBO5rkm7lpNSyrZtxadZ8vvnXPd9P+uyMF8AAILfp4C/qAMwNgAQrZTqu/Z8lPMA0I9Sz9v7Moj0AKzVFAAsYqsA7PYhEP9jLwAAQULvxJNSyqIoJu17n87B/p3n3QCMXeqyLJNxHO/2VVVl1nnxAJjsz+dTeZ5n1nnRAJSXy0UGPu/vRVdQfL9PNlnCMAyTN8YU+M0YkzdNk4zjOPtwBvgGIPp+QszzPI9lWSpjjLPWuiwCIPzTsjR5no/qEgIgfPlqogtWCyGEtdbNsgAAAAAAAAAAAAAAAACA7/UGYbO6gXP6EfMAAAAASUVORK5CYII=', 'base64');

// Write the placeholder PNG files
fs.writeFileSync('icon16.png', png16);
fs.writeFileSync('icon48.png', png48);
fs.writeFileSync('icon128.png', png128);

// For recording versions, just copy the same files
fs.writeFileSync('icon16-recording.png', png16);
fs.writeFileSync('icon48-recording.png', png48);
fs.writeFileSync('icon128-recording.png', png128);

console.log('Icon files created successfully!');
console.log('Created: icon16.png, icon48.png, icon128.png');
console.log('Created: icon16-recording.png, icon48-recording.png, icon128-recording.png');