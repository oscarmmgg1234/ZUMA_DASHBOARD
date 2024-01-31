import React from "react";
import tw from "tailwind-styled-components";

const Overlay = tw.div`

  z-20
  top-0
  left-0
  w-full
  h-full
  flex
  flex-col
  items-center
  justify-center
  bg-gray-900
  opacity-90
`;

const Blur = tw.div`
  text-6xl
  text-white
  font-bold
  text-center
  text-opacity-25
  backdrop-blur-lg
`;

const RedBar = tw.div`
  fixed
  z-10
  bottom-0
  left-0
  w-full
  h-20
  bg-red-500
  opacity-75
`;

const AlertCardGrid = tw.div`
  mt-20
  grid
  grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
  gap-4
  px-4 py-6
`;

const AlertCard = tw.div`
  bg-white
  shadow-md
  rounded-md
  p-4
`;

const CardGrid = tw.div`
  grid
  grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
  gap-4
  px-4 py-6
`;

const Card = tw.div`
  bg-white
  shadow-md
  rounded-md
  p-4
`;
const SubComponent = tw.div`
  bg-gray-100
  rounded-md
  p-4
`;

const DashboardBody = () => {
  return (
    <>
      <Overlay>
        <Blur>Coming Soon</Blur>

        <CardGrid>
          <Card>
            <h2>Card Title 1</h2>
            <p>Card content goes here.</p>
            <SubComponent>
              <h3>Sub-component Title 1</h3>
              <p>Sub-component content goes here.</p>
            </SubComponent>
          </Card>
          <Card>
            <h2>Card Title 2</h2>
            <p>Card content goes here.</p>
            <SubComponent>
              <h3>Sub-component Title 2</h3>
              <p>Sub-component content goes here.</p>
            </SubComponent>
          </Card>
          <Card>
            <h2>Card Title 3</h2>
            <p>Card content goes here.</p>
            <SubComponent>
              <h3>Sub-component Title 3</h3>
              <p>Sub-component content goes here.</p>
            </SubComponent>
          </Card>
          <Card>
            <h2>Card Title 4</h2>
            <p>Card content goes here.</p>
            <SubComponent>
              <h3>Sub-component Title 4</h3>
              <p>Sub-component content goes here.</p>
            </SubComponent>
          </Card>
          <Card>
            <h2>Card Title 5</h2>
            <p>Card content goes here.</p>
            <SubComponent>
              <h3>Sub-component Title 5</h3>
              <p>Sub-component content goes here.</p>
            </SubComponent>
          </Card>
          <Card>
            <h2>Card Title 4</h2>
            <p>Card content goes here.</p>
            <SubComponent>
              <h3>Sub-component Title 4</h3>
              <p>Sub-component content goes here.</p>
            </SubComponent>
          </Card>
          <Card>
            <h2>Card Title 4</h2>
            <p>Card content goes here.</p>
            <SubComponent>
              <h3>Sub-component Title 4</h3>
              <p>Sub-component content goes here.</p>
            </SubComponent>
          </Card>
          <Card>
            <h2>Card Title 4</h2>
            <p>Card content goes here.</p>
            <SubComponent>
              <h3>Sub-component Title 4</h3>
              <p>Sub-component content goes here.</p>
            </SubComponent>
          </Card>
        </CardGrid>
      </Overlay>
    </>
  );
};

export default DashboardBody;
