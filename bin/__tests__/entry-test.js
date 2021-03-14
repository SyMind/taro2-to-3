const path = require('path');
const {unIndent} = require('../utils');
const Entry = require('../entry');

describe('Entry', () => {
  it('basic', () => {
    const entryFile = path.resolve(__dirname, '../__testfixtures__/entry/basic.js');
    const entry = new Entry(entryFile);
    expect(entry.entryComponent).toBeTruthy();
    expect(entry.pages).toEqual(['pages/home/home']);
    
    const transformedSource = entry.transform();
    expect(transformedSource.trim()).toEqual(
      unIndent`
        import Taro, {Component} from '@tarojs/taro';

        class App extends Component {
          config = {
            pages: [
              'pages/home/home'
            ]
          }

          render() {
            return this.props.children;
          }
        }
        
        export default App;
      `
    );
  });

  it('replace render method', () => {
    const entryFile = path.resolve(__dirname, '../__testfixtures__/entry/with-render-method.js');
    const entry = new Entry(entryFile);
    const transformedSource = entry.transform();
    expect(transformedSource.trim()).toEqual(
      unIndent`
        import Taro, {Component} from '@tarojs/taro';

        class App extends Component {
          config = {
            pages: [
              'pages/home/home'
            ]
          }

          render() {
            return this.props.children;
          }
        }
        
        export default App;
      `
    );
  });
});
