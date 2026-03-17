import Footer from "../components/Footer";

export default function legal() {
  return (
   <main className="min-h-screen">
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h1 className="text-6xl font-bold mb-10 text-center" >Legal</h1>

        <div className="space-y-1" >
                <h2 className="text-xl font-black"style={{ color: "#BB9557" }}>
                   • Terms of Use 
                  </h2>
                  <h2 className="text-lg font-normal">
                    These Terms of Use define how users may access and interact with the platform dedicated to documenting Algerian heritage, including sites such as Casbah of Algiers and Timgad.
                  </h2>
                  <p className=" font-bold text-lg leading-relaxed">User Responsibilities</p>
                  <p className="text-lg leading-loose" >Users agree to:</p>
                  <p className="list-disc pl-6 text-lg leading-loose"> •Share accurate and respectful content </p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •Respect copyright laws </p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •Follow community guidelines</p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •Not misuse the platform or attempt hacking </p> 
                  
                  <p className=" font-bold text-lg leading-relaxed">Account Rules</p>
                  <p className="text-lg leading-loose" >Accounts may be suspended if users upload inappropriate, false, or harmful content.</p>
          </div>
          <div className="space-y-1">
                <h2 className="text-xl font-black"style={{ color: "#BB9557" }}>
                   • Privacy Policy
                  </h2>
                  <p className=" font-bold text-lg leading-relaxed">Data Collected</p>
                  <p className="text-lg leading-loose" >We may collect:</p>
                  <p className="list-disc pl-6 text-lg leading-loose"> •Name or username </p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •Email address </p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •Uploaded content</p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> No unnecessary personal data is collected. </p> 
                  
                  <p className=" font-bold text-lg leading-relaxed">How Data Is Used</p>
                  <p className="text-lg leading-loose" >Data is use only to:</p>
                  <p className="list-disc pl-6 text-lg leading-loose">•Manage user accounts </p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •Improve the platform </p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •Ensure security</p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •We do not sell or share user data with third parties. </p> 
                  
                  <p className=" font-bold text-lg leading-relaxed">User Rights</p>
                  <p className="text-lg leading-loose" >Users may request deletion of their account or personal data.</p>

          </div>
          <div className="space-y-1">
                <h2 className="text-xl font-black"style={{ color: "#BB9557" }}>
                   • Content Policy
                  </h2>
                  <p className=" font-bold text-lg leading-relaxed">Allowed Content</p>
                  <p className="list-disc pl-6 text-lg leading-loose"> •Heritage photos </p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •Historical information </p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •Educational annotations</p> 
                  
                  <p className=" font-bold text-lg leading-relaxed">Prohibited Content</p>
                  <p className="list-disc pl-6 text-lg leading-loose"> •Offensive or political content </p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •Fake information </p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •Spam or advertisements</p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •Copyrighted material without permission</p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> Inappropriate content will be removed to protect the platform’s quality. </p> 
        
                  <p className=" font-bold text-lg leading-relaxed">Verification</p>
                  <p className="text-lg leading-loose" >Moderators may review and edit content to maintain accuracy.</p>
          </div>
          <div className="space-y-1">
                <h2 className="text-xl font-black"style={{ color: "#BB9557" }}>
                   • Credits & Sources 
                  </h2>
                  <h2 className="text-lg font-normal">
                    To acknowledge authors, researchers, and institutions that contributed information or media.
                  </h2>
                  <p className="text-lg leading-loose" >What to Include</p>
                  <p className="list-disc pl-6 text-lg leading-loose">  •Books and articles used </p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •Historical websites </p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •Photographers and image owners</p> 
                  <p className="list-disc pl-6 text-lg leading-loose"> •University supervisors </p> 
                  
          </div>
      </section>
      <Footer />
    </main>
  );
}