import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {VersionAttachment} from './VersionAttachment';
const documents=[{id:'old',name:'historical.pdf'},{id:'new',name:'current.docx'}];
const render=(document_id:string|null,busy=false)=>renderToStaticMarkup(<VersionAttachment version={{document_id}} documents={documents} busy={busy} onDownload={()=>{}}/>);
describe('saved version attachment',()=>{
 it('displays the historical file instead of the current file',()=>{const markup=render('old');expect(markup).toContain('historical.pdf');expect(markup).toContain('Download original');expect(markup).not.toContain('current.docx')});
 it('displays the selected current file',()=>{const markup=render('new');expect(markup).toContain('current.docx');expect(markup).not.toContain('historical.pdf')});
 it('does not fall back to other files after detachment',()=>{const markup=render(null);expect(markup).toContain('No original attachment');expect(markup).not.toContain('Download original')});
 it('does not expose a download when the record is missing',()=>{const markup=render('missing');expect(markup).toContain('Original attachment unavailable');expect(markup).not.toContain('Download original')});
 it('disables the download during an active request',()=>expect(render('old',true)).toContain('disabled=""'));
});
